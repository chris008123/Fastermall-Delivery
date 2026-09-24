import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Package,
  Store,
} from 'lucide-react-native';

import { useJobsStore } from '@/src/stores/jobsStore';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme/colors';
import type { JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';

function getTypeLabel(type: JobType) {
  switch (type) {
    case 'FOOD':
      return 'Food delivery';

    case 'LAUNDRY':
      return 'Laundry delivery';

    case 'MARKETPLACE':
      return 'Marketplace delivery';

    default:
      return 'Delivery';
  }
}

function getTypeIcon(type: JobType) {
  switch (type) {
    case 'FOOD':
      return Store;

    case 'LAUNDRY':
      return Package;

    case 'MARKETPLACE':
    default:
      return Package;
  }
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const job = useJobsStore((state) =>
    state.jobs.find((item) => item.id === id),
  );

  const acceptJob = useJobsStore(
    (state) => state.acceptJob,
  );

  const loadJobs = useJobsStore(
    (state) => state.loadJobs,
  );

  const isLoading = useJobsStore(
    (state) => state.isLoading,
  );

  const [isAccepting, setIsAccepting] =
    useState(false);

  const [screenError, setScreenError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!job && id) {
      void loadJobs();
    }
  }, [job, id, loadJobs]);

  if (!job) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {isLoading ? (
          <>
            <ActivityIndicator
              size="large"
              color={theme.primary}
            />

            <Text
              style={[
                styles.loadingText,
                { color: theme.mutedText },
              ]}
            >
              Loading delivery...
            </Text>
          </>
        ) : (
          <>
            <Package
              size={38}
              color={theme.mutedText}
            />

            <Text
              style={[
                styles.notFoundTitle,
                { color: theme.text },
              ]}
            >
              Delivery not found
            </Text>

            <Text
              style={[
                styles.notFoundText,
                { color: theme.mutedText },
              ]}
            >
              This delivery may no longer be
              available.
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backToJobsButton,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text style={styles.backToJobsText}>
                Back to deliveries
              </Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const TypeIcon = getTypeIcon(job.type);

  const isAvailable = job.stage === 'AVAILABLE';

  const isAlreadyAssigned =
    !isAvailable &&
    ![
      'COMPLETED',
      'FAILED',
    ].includes(job.stage);

  const handleAccept = async () => {
    if (!isAvailable || isAccepting) {
      return;
    }

    setScreenError(null);
    setIsAccepting(true);

    try {
      await acceptJob(job.id);

      router.replace(
        `/(partner)/active/${job.id}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to accept this delivery.';

      setScreenError(message);

      Alert.alert(
        'Unable to accept delivery',
        message,
      );
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ArrowLeft
            size={20}
            color={theme.text}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: theme.text },
          ]}
        >
          Delivery details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.typeCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.typeIcon,
              {
                backgroundColor: theme.background,
              },
            ]}
          >
            <TypeIcon
              size={24}
              color={theme.primary}
            />
          </View>

          <View style={styles.typeInfo}>
            <Text
              style={[
                styles.typeTitle,
                { color: theme.text },
              ]}
            >
              {getTypeLabel(job.type)}
            </Text>

            <Text
              style={[
                styles.typeSubtitle,
                { color: theme.mutedText },
              ]}
            >
              {job.partnerMode === 'MOTORCYCLE'
                ? 'Motorcycle delivery'
                : 'Walking delivery'}
            </Text>
          </View>

          <View style={styles.feeContainer}>
            <Text
              style={[
                styles.feeLabel,
                { color: theme.mutedText },
              ]}
            >
              EARNING
            </Text>

            <Text
              style={[
                styles.fee,
                { color: theme.primary },
              ]}
            >
              {formatCurrency(job.deliveryFee)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Route
          </Text>

          <View style={styles.route}>
            <View style={styles.routeIndicator}>
              <View
                style={[
                  styles.routeDot,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                ]}
              />

              <View
                style={[
                  styles.routeLine,
                  {
                    backgroundColor:
                      theme.border,
                  },
                ]}
              />

              <View
                style={[
                  styles.routeDot,
                  {
                    backgroundColor: theme.text,
                  },
                ]}
              />
            </View>

            <View style={styles.routeDetails}>
              <View style={styles.routePoint}>
                <Text
                  style={[
                    styles.routeLabel,
                    { color: theme.mutedText },
                  ]}
                >
                  PICKUP
                </Text>

                <Text
                  style={[
                    styles.routeMain,
                    { color: theme.text },
                  ]}
                >
                  {job.pickup.label}
                </Text>

                <Text
                  style={[
                    styles.routeSub,
                    { color: theme.mutedText },
                  ]}
                >
                  {job.pickup.sub}
                </Text>
              </View>

              <View
                style={[
                  styles.routePoint,
                  styles.dropoffPoint,
                ]}
              >
                <Text
                  style={[
                    styles.routeLabel,
                    { color: theme.mutedText },
                  ]}
                >
                  DROP-OFF
                </Text>

                <Text
                  style={[
                    styles.routeMain,
                    { color: theme.text },
                  ]}
                >
                  {job.dropoff.label}
                </Text>

                <Text
                  style={[
                    styles.routeSub,
                    { color: theme.mutedText },
                  ]}
                >
                  {job.dropoff.sub}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Order
          </Text>

          <View style={styles.orderRow}>
            <Package
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.orderInfo}>
              <Text
                style={[
                  styles.orderLabel,
                  { color: theme.mutedText },
                ]}
              >
                ITEMS
              </Text>

              <Text
                style={[
                  styles.orderValue,
                  { color: theme.text },
                ]}
              >
                {job.itemsSummary}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.border },
            ]}
          />

          <View style={styles.orderRow}>
            <Clock3
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.orderInfo}>
              <Text
                style={[
                  styles.orderLabel,
                  { color: theme.mutedText },
                ]}
              >
                DELIVERY MODE
              </Text>

              <Text
                style={[
                  styles.orderValue,
                  { color: theme.text },
                ]}
              >
                {job.partnerMode === 'MOTORCYCLE'
                  ? 'Motorcycle'
                  : 'Walking'}
              </Text>
            </View>
          </View>
        </View>

        {job.type === 'FOOD' && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.infoTitle,
                { color: theme.text },
              ]}
            >
              Food delivery
            </Text>

            <Text
              style={[
                styles.infoText,
                { color: theme.mutedText },
              ]}
            >
              After reaching the vendor, you will
              pay for the order using your assigned
              delivery funds before collecting it.
            </Text>
          </View>
        )}

        {screenError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.danger,
              },
            ]}
          >
            <Text
              style={[
                styles.errorTitle,
                { color: theme.danger },
              ]}
            >
              Something went wrong
            </Text>

            <Text
              style={[
                styles.errorText,
                { color: theme.mutedText },
              ]}
            >
              {screenError}
            </Text>
          </View>
        )}

        {!isAvailable && isAlreadyAssigned && (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.warningTitle,
                { color: theme.text },
              ]}
            >
              Delivery already assigned
            </Text>

            <Text
              style={[
                styles.warningText,
                { color: theme.mutedText },
              ]}
            >
              This delivery has already been
              accepted by a delivery partner.
            </Text>
          </View>
        )}

        {isAvailable && (
          <Pressable
            disabled={isAccepting}
            onPress={() => void handleAccept()}
            style={({ pressed }) => [
              styles.acceptButton,
              {
                backgroundColor: theme.primary,
                opacity:
                  pressed || isAccepting ? 0.8 : 1,
              },
            ]}
          >
            {isAccepting ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text style={styles.acceptText}>
                  Accept delivery
                </Text>

                <ChevronRight
                  size={21}
                  color="#FFFFFF"
                />
              </>
            )}
          </Pressable>
        )}

        {!isAvailable &&
          !isAlreadyAssigned &&
          job.stage === 'COMPLETED' && (
            <View
              style={[
                styles.completedCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.completedTitle,
                  { color: theme.text },
                ]}
              >
                Delivery completed
              </Text>

              <Text
                style={[
                  styles.completedText,
                  { color: theme.mutedText },
                ]}
              >
                This delivery has already been
                completed.
              </Text>
            </View>
          )}

        {!isAvailable &&
          !isAlreadyAssigned &&
          job.stage === 'FAILED' && (
            <View
              style={[
                styles.completedCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.completedTitle,
                  { color: theme.text },
                ]}
              >
                Delivery failed
              </Text>

              <Text
                style={[
                  styles.completedText,
                  { color: theme.mutedText },
                ]}
              >
                This delivery was marked as failed.
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },

  notFoundTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 14,
  },

  notFoundText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },

  backToJobsButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  backToJobsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  header: {
    height: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  typeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeInfo: {
    flex: 1,
    marginLeft: 12,
  },

  typeTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  typeSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  feeContainer: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  feeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  fee: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },

  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 18,
  },

  route: {
    flexDirection: 'row',
  },

  routeIndicator: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },

  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  routeLine: {
    width: 1,
    height: 58,
    marginVertical: 5,
  },

  routeDetails: {
    flex: 1,
    marginLeft: 10,
  },

  routePoint: {
    minHeight: 72,
  },

  dropoffPoint: {
    minHeight: 65,
  },

  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  routeMain: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },

  routeSub: {
    fontSize: 12,
    marginTop: 3,
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  orderInfo: {
    flex: 1,
    marginLeft: 11,
  },

  orderLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  orderValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },

  divider: {
    height: 1,
    marginVertical: 15,
  },

  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  errorText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  warningCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  warningText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  acceptButton: {
    minHeight: 54,
    borderRadius: 15,
    marginTop: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  acceptText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  completedCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 17,
    marginTop: 18,
  },

  completedTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  completedText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },
});
